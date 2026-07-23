import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserServiceMock } from './user.service.mock';

@Module({
  // imports: [TypeOrmModule.forFeature([User])],
  providers: [
    // For development mode, always use mock service to avoid database dependency
    { provide: UserService, useClass: UserServiceMock }
  ],
  exports: [UserService],
})
export class UserModule {}
