import { Injectable } from '@nestjs/common';

export interface UserData {
  id?: string;
  email: string;
  name: string;
  password?: string;
}

@Injectable()
export class UserServiceMock {
  private users: Map<string, UserData> = new Map();
  private idCounter = 1;

  async findByEmail(email: string): Promise<UserData | null> {
    return this.users.get(email.toLowerCase()) || null;
  }

  async create(userData: UserData): Promise<UserData> {
    const user = {
      ...userData,
      id: String(this.idCounter++),
    };
    this.users.set(userData.email.toLowerCase(), user);
    return user;
  }

  async update(id: string, userData: Partial<UserData>): Promise<UserData | null> {
    for (const [email, user] of this.users) {
      if (user.id === id) {
        const updated = { ...user, ...userData };
        this.users.set(email, updated);
        return updated;
      }
    }
    return null;
  }

  async delete(id: string): Promise<boolean> {
    for (const [email, user] of this.users) {
      if (user.id === id) {
        this.users.delete(email);
        return true;
      }
    }
    return false;
  }

  async findAll(): Promise<UserData[]> {
    return Array.from(this.users.values());
  }
}
