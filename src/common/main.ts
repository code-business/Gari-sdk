import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import constants from '../constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Gari-Sdk')
    .setDescription('The Gari-Sdk API description')
    .setVersion('1.0')
    .addTag('solana')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(constants.PORT);
  console.log('server listen on port', constants.PORT);
}
bootstrap();
