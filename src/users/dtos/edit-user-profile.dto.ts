import { InputType, ObjectType, PartialType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class EditUserProfileInput extends PartialType(
  PickType(User, ['email', 'password', 'location']),
) {}

@ObjectType()
export class EditUserProfileOutput extends CoreOutput {}
