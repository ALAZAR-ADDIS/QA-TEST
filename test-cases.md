```TypeScript
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

// ─── Shared Fixtures ──────────────────────────────────────────────────────────

const mockUser: User = {
  id: 1,
  name: 'Alice',
  email: 'alice@test.com',
  transactions: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const createDto: CreateUserDto = { name: 'Alice', email: 'alice@test.com' };

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  preload: jest.fn(),
};

// helper: build a QueryFailedError with a postgres error code
function makeQueryError(code: string): QueryFailedError {
  const err = Object.create(QueryFailedError.prototype) as QueryFailedError & { code: string };
  err.message = 'query failed';
  err.code = code;
  return err;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('returns 201 and the saved user on success', async () => {
      mockRepo.create.mockReturnValue(mockUser);
      mockRepo.save.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.message).toBe('User created successfully');
      expect(result.data).toEqual(mockUser);
      expect(mockRepo.create).toHaveBeenCalledWith(createDto);
      expect(mockRepo.save).toHaveBeenCalledWith(mockUser);
    });

    it('returns 201 (bug: should be 409) when email is a duplicate — documents known defect', async () => {
      mockRepo.create.mockReturnValue(mockUser);
      mockRepo.save.mockRejectedValue(makeQueryError('23505'));

      const result = await service.create(createDto);

      // NOTE: service incorrectly returns 201 instead of throwing 409 ConflictException
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.data.id).toBe(0); // fake placeholder id exposes the bug
    });

    it('throws HttpException 500 on unexpected database error', async () => {
      mockRepo.create.mockReturnValue(mockUser);
      mockRepo.save.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.create(createDto)).rejects.toThrow(HttpException);

      try {
        await service.create(createDto);
      } catch (e: any) {
        expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(e.getResponse().message).toBe('Error creating user');
      }
    });
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('returns 200 and a list of users with their transactions', async () => {
      mockRepo.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Users retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockUser);
      expect(mockRepo.find).toHaveBeenCalledWith({ relations: ['transactions'] });
    });

    it('returns 200 and an empty array when no users exist', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toEqual([]);
    });

    it('throws HttpException 500 on database error', async () => {
      mockRepo.find.mockRejectedValue(new Error('DB unavailable'));

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('returns 200 and the user when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('User retrieved successfully');
      expect(result.data).toEqual(mockUser);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['transactions'],
      });
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('User with ID 999 not found');
    });

    it('throws HttpException 500 on unexpected database error', async () => {
      mockRepo.findOne.mockRejectedValue(new Error('DB timeout'));

      await expect(service.findOne(1)).rejects.toThrow(HttpException);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update()', () => {
    const updateDto: CreateUserDto = { name: 'Alice Updated', email: 'alice@test.com' };
    const updatedUser: User = { ...mockUser, name: 'Alice Updated' };

    it('returns 200 and the updated user on success', async () => {
      mockRepo.preload.mockResolvedValue(updatedUser);
      mockRepo.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('User updated successfully');
      expect(result.data.name).toBe('Alice Updated');
      expect(mockRepo.preload).toHaveBeenCalledWith({ id: 1, ...updateDto });
    });

    it('throws NotFoundException when user to update does not exist', async () => {
      mockRepo.preload.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, updateDto)).rejects.toThrow('User with ID 999 not found');
    });

    it('throws ConflictException when updating to a duplicate email', async () => {
      mockRepo.preload.mockResolvedValue(updatedUser);
      mockRepo.save.mockRejectedValue(makeQueryError('23505'));

      await expect(service.update(1, updateDto)).rejects.toThrow('Email already exists');
    });

    it('throws HttpException 500 on unexpected database error', async () => {
      mockRepo.preload.mockResolvedValue(updatedUser);
      mockRepo.save.mockRejectedValue(new Error('DB crash'));

      await expect(service.update(1, updateDto)).rejects.toThrow(HttpException);
    });
  });
});
```
