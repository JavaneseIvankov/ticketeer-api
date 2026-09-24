import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { HealthCheckController } from "./health-check.controller.js";

@Module({
   imports: [DatabaseModule],
   controllers: [HealthCheckController]
})

export class HealthCheckModule {}