import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/index.js';

export const Roles = Reflector.createDecorator<UserRole[]>();
