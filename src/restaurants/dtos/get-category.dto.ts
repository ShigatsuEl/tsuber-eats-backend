import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Category } from '../entities/category.entity';

@ArgsType()
export class GetCategoryInput {
  @Field((type) => String)
  slug: string;
}

@ObjectType()
export class GetCategoryOutput extends CoreOutput {
  @Field((type) => Category, { nullable: true })
  category?: Category;
}
