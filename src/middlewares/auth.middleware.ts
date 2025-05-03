import { NextFunction, Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models";

export const verifyJWT = asyncHandler(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        throw new Error("Unauthorized request");
      }

      const decodedToken: any = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      );

      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );

      if (!user) {
        throw new Error("Invalid Access Token");
      }

      req.user = user;
      next();
    } catch (error: any) {
      throw new Error(error?.message || "Invalid access token");
    }
  }
);
