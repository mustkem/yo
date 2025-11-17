import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

class LoginRequestBody {
  @ApiProperty() email: string;
  @ApiProperty() password: string;
}

class LoginResponseBody {
  @ApiProperty() token: string;
  constructor(token: string) {
    this.token = token;
  }
}

class RegisterRequestBody {
  @ApiProperty() email: string;
  @ApiProperty() username: string;
  @ApiProperty() password: string;
  @ApiProperty({ required: false }) name?: string;
  @ApiProperty({ required: false }) avatar?: string;
  @ApiProperty({ required: false }) bio?: string;
}

class RegisterResponseBody {
  @ApiProperty() id: string;
  @ApiProperty() username: string;
  @ApiProperty({ required: false }) email?: string;
  @ApiProperty({ required: false }) name?: string;
  @ApiProperty({ required: false }) avatar?: string;
  @ApiProperty({ required: false }) bio?: string;

  constructor(params: {
    id: string;
    email: string;
    username: string;
    name?: string;
    avatar?: string;
    bio?: string;
  }) {
    this.id = params.id;
    this.email = params.email;
    this.username = params.username;
    this.name = params.name;
    this.avatar = params.avatar;
    this.bio = params.bio;
  }
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiResponse({ type: LoginResponseBody })
  @Post('/login')
  async login(@Body() body: LoginRequestBody) {
    const session = await this.authService.createNewSessionLogin(
      body.email,
      body.password,
    );
    return new LoginResponseBody(session.id);
  }

  @ApiResponse({ type: RegisterResponseBody })
  @Post('/register')
  async register(@Body() body: RegisterRequestBody) {
    const user = await this.authService.registerNewUser(body);
    return new RegisterResponseBody({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
    });
  }
}
