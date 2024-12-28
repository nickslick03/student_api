import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  index(): string {
    return 'hello';
  }

  @Post('/students')
  async postStudents(
    @Body() body: { username: string; password: string; socketID: string },
    @Res() res: Response,
  ) {
    const students = await this.appService.getStudents(body);
    if ('code' in students) {
      return res.status(students.code).json(students.message);
    }
    return res.json(students);
  }
}
