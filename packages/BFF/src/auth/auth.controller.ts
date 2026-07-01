import { Body, Controller, Post } from '@nestjs/common';

interface LoginRequest {
  email: string;
  password: string;
  captchaToken: string;
}

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() loginRequest: LoginRequest) {
    const { email, password, captchaToken } = loginRequest;

    // POST /auth/login/challenge
    /*
    Body:
    {
        "email": "user@email.com",
        "ip": "x.x.x.x"
    }
    */

    /*
    Response:
    {
        "captchaRequired": true,
        "captchaProvider": "turnstile"
    }

    if (!captchaRequired) {
        // POST /auth/login/verify
        /*
        Body:
        {
            "email": "
    */
  }

  @Post('logout')
  logout() {
    // Implement logout logic here
  }
}
