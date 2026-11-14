import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum.js';

export class UserProfileDto {
  @ApiProperty({ example: '862fa7d1-bf32-4416-8f2e-0683a3118cf2' })
  id: string;

  @ApiProperty({ example: 'admin@acme.com' })
  email: string;

  @ApiProperty({ example: 'HR Administrator' })
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.HR_ADMIN })
  role: UserRole;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
