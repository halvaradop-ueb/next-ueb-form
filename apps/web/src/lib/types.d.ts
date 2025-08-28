import { User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Role } from '@/lib/@types/types';

declare module 'next-auth' {
  interface User {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}
