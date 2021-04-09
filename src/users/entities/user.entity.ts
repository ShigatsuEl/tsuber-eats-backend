import { Core } from 'src/common/entities/core.entity';
import { Column, Entity } from 'typeorm';

type UserRole = 'client' | 'owner' | 'delivery';

@Entity()
export class User extends Core {
  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  role: UserRole;
}
