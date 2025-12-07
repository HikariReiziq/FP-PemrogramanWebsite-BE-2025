/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { type NextFunction, type Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { JwtUtils } from '@/utils';

import { prisma } from '../config';
import { type AuthedRequest, type ROLE } from '../interface';
import { ErrorResponse } from '../response';

export const validateAuth =
  ({
    enable = true,
    optional = false,
    allowed_roles,
  }: {
    enable?: boolean;
    optional?: boolean;
    allowed_roles?: ROLE[];
  }) =>
  async (request: AuthedRequest, _: Response, next: NextFunction) => {
    if (!enable) {
      return next();
    }

    try {
      const requestToken = request.headers['authorization']?.split(' ');

      if (
        !optional &&
        (!requestToken ||
          requestToken[0].toLowerCase() !== 'bearer' ||
          !requestToken[1])
      )
        throw new ErrorResponse(StatusCodes.UNAUTHORIZED, 'Token required');

      if (requestToken) {
        const payload = JwtUtils.verifyToken(requestToken[1]);

        if (!payload)
          throw new ErrorResponse(StatusCodes.FORBIDDEN, 'Invalid token');

        const userData = await prisma.users.findUnique({
          where: {
            id: payload.id,
            role: payload.role,
          },
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        if (!userData)
          throw new ErrorResponse(
            StatusCodes.FORBIDDEN,
            'Invalid token, user not found',
          );

        if (
          allowed_roles &&
          userData.role !== 'SUPER_ADMIN' &&
          ![...allowed_roles].some(role => userData.role.includes(role))
        ) {
          throw new ErrorResponse(
            StatusCodes.FORBIDDEN,
            'This role is not allowed to access the endpoint',
          );
        }

        request.user = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          user_id: userData.id,
        };
      }

      next();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return next(error);
    }
  };
