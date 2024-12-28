import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

export interface student {
  imageUrl: string;
  fullName: string;
  id: string;
  email: string;
  building: string;
  room: string;
  major: string;
}

interface error {
  code: number;
  message: string;
}

const sleep = async (seconds: number) =>
  new Promise((res) => setTimeout(res, seconds * 1000));

@Injectable()
export class AppService {
  static sccUrl = 'https://apex.messiah.edu/apex/f?p=294';

  async getStudents({
    username,
    password,
    //socketID,
  }: {
    username: string;
    password: string;
    //socketID: string;
  }): Promise<student[] | error> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    const mainPage = await browser.newPage();
    try {
      await mainPage.goto(AppService.sccUrl, { waitUntil: 'networkidle0' });
    } catch (e) {
      await browser.close();
      throw new Error('Messiah CAS is not loading. Please try again later.');
    }

    try {
      await mainPage.type('#username', username);
      await mainPage.type('#password', password);

      await mainPage.click('button[name=submit]');
      await sleep(5);
      if ((await mainPage.title()) !== 'Students') {
        await browser.close();
        return {
          code: 400,
          message: 'Username or password is incorrect.',
        };
      }

      // click advanced button to sort by room numbber
      await Promise.all([
        mainPage.waitForNavigation(),
        mainPage.evaluate(() =>
          [...document.querySelectorAll<HTMLAnchorElement>('.t15c a')]
            .filter((a) => a.textContent === 'Advanced')[0]
            .click(),
        ),
      ]);

      const studentUrls = await mainPage.evaluate(() =>
        [...document.querySelectorAll('a')]
          .filter((a) => a.textContent.includes(', '))
          .map((a) => a.href),
      );
      const students: student[] = [];

      for (const url of studentUrls) {
        const studentPage = await browser.newPage();
        await studentPage.goto(url);

        const student = await studentPage.evaluate(() => {
          const studentCells = [
            ...document.querySelectorAll('#R27143324834839494 .t15data'),
          ];
          const programCells = [
            ...document.querySelectorAll('#R27348423794699608 .t15data'),
          ];
          const imageTag = studentCells[0].children[0] as HTMLImageElement;

          return {
            imageUrl: imageTag.src,
            fullName: studentCells[1].children[0].textContent,
            id: studentCells[2].textContent,
            email: studentCells[9].children[0].textContent,
            building: studentCells.at(-1).textContent.split(' ')[0],
            room: studentCells.at(-1).textContent.split(' ').at(-1),
            major: programCells[1].textContent,
          };
        });

        // this.AppGateway.emitEvent(
        //   socketID,
        //   'updateProgress',
        //   `Gathering info on ${student.fullName}`,
        // );

        students.push(student);
        await studentPage.close();
      }
      await browser.close();
      return students;
    } catch (e) {
      console.log(e);
      await browser.close();
      return {
        code: 500,
        message:
          e?.message ?? "Please tell web admin SCC Scraper isn't working.",
      };
    }
  }
}
