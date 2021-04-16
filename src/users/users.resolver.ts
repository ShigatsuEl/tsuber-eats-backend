import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import {
  EditUserProfileInput,
  EditUserProfileOutput,
} from './dtos/edit-user-profile.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import {
  GetUserProfileInput,
  GetUserProfileOutput,
} from './dtos/get-user-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { UserService } from './users.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query((returns) => User)
  @UseGuards(AuthGuard)
  loginUser(@AuthUser() authUser: User) {
    return authUser;
  }

  @Query((returns) => GetUserProfileOutput)
  @UseGuards(AuthGuard)
  async getUserProfile(
    @Args() userProfileInput: GetUserProfileInput,
  ): Promise<GetUserProfileOutput> {
    try {
      const user = await this.userService.findById(userProfileInput.userId);
      if (!user) throw Error();
      return { ok: true, user };
    } catch (error) {
      return { error: 'User not found', ok: false };
    }
  }

  @Mutation((returns) => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    try {
      return this.userService.createAccount(createAccountInput);
    } catch (error) {
      return { error, ok: false };
    }
  }

  @Mutation((returns) => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    try {
      return this.userService.login(loginInput);
    } catch (error) {
      return { error, ok: false };
    }
  }

  @UseGuards(AuthGuard)
  @Mutation((returns) => EditUserProfileOutput)
  async editUserProfile(
    @AuthUser() authUser: User,
    @Args('input') editUserProfileInput: EditUserProfileInput,
  ): Promise<EditUserProfileOutput> {
    try {
      await this.userService.editUserProfile(authUser.id, editUserProfileInput);
      return { ok: true };
    } catch (error) {
      return { error, ok: false };
    }
  }

  @Mutation((returns) => VerifyEmailOutput)
  async verifyEmail(
    @Args('input') verifyEmailInput: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    try {
      await this.userService.verifyEmail(verifyEmailInput.code);
      return { ok: true };
    } catch (error) {
      return { error, ok: false };
    }
  }
}
