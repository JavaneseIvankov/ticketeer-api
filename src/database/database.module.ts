import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from "../config/app-config.service.js";
import { entities }from "./entities.js"

@Module({
   imports: [
      TypeOrmModule.forRootAsync({
         inject: [AppConfigService],
         useFactory: (cfg: AppConfigService) => ({
            type: 'postgres',
            host: cfg.dbHost,
            port: cfg.dbPort,
            username: cfg.dbUsername,
            password: cfg.dbPassword,
            database: cfg.dbName,
            entities: entities,
            synchronize: !cfg.isProduction,
            logging: !cfg.isProduction && !cfg.isTest ? ['error', 'warn'] : false,
         })
      })
   ],
})

export class DatabaseModule {}