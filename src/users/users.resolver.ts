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
import { Role } from 'src/auth/role.decorator';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  // 어떠한 MetaData가 없다면 인증이 필요없는 public resolver를 의미
  // MetaData가 있다면 인증단계를 거쳐야 하며 그 후 role을 확인함을 의미
  @Query((returns) => User)
  @Role(['Any'])
  loginUser(@AuthUser() authUser: User) {
    return authUser;
  }

  @Query((returns) => GetUserProfileOutput)
  @Role(['Any'])
  async getUserProfile(
    @Args() userProfileInput: GetUserProfileInput,
  ): Promise<GetUserProfileOutput> {
    return this.userService.findById(userProfileInput.userId);
  }

  @Mutation((returns) => CreateAccountOutput)
  createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return this.userService.createAccount(createAccountInput);
  }

  @Mutation((returns) => LoginOutput)
  login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return this.userService.login(loginInput);
  }

  @Mutation((returns) => EditUserProfileOutput)
  @Role(['Any'])
  editUserProfile(
    @AuthUser() authUser: User,
    @Args('input') editUserProfileInput: EditUserProfileInput,
  ): Promise<EditUserProfileOutput> {
    return this.userService.editUserProfile(authUser.id, editUserProfileInput);
  }

  @Mutation((returns) => VerifyEmailOutput)
  verifyEmail(
    @Args('input') verifyEmailInput: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    return this.userService.verifyEmail(verifyEmailInput.code);
  }
}
