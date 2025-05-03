import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.models";
import { ErrorResponse } from "../utils/ErrorResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/AppResponse";
import jwt from "jsonwebtoken";

const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { fullName, email, password } = req.body;

    if ([fullName, email, password].some((field) => field?.trim() === "")) {
      throw new ErrorResponse(400, "All fields are required");
    }

    const existUser = await User.findOne({
      $or: [{ fullName, email }],
    });

    if (existUser) {
      throw new Error("User with email or username already exists");
    }

    const user = await User.create({
      fullName,
      email,
      password,
    });

    const createdUser = await User.findById(user._id).select("-password");

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  }
);

const generateToken: any = async (userId: any) => {
  try {
    const user = await User.findById({ _id: userId });

    const accessToken = await user?.generateAccessToken();
    const refreshToken = await user?.refreshAccessToken();

    if (!user) {
      throw new Error("User not found");
    }

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new Error(
      "Something went wrong while generating referesh and access token"
    );
  }
};

const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if ([email, password].some((field) => field?.trim() === "")) {
      throw new ErrorResponse(400, "All fields are required");
    }

    const user = await User.findOne({
      $or: [{ email }],
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new Error("Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateToken(user._id);

    const loggedUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, loggedUser, "User registered Successfully"));
  }
);

const logOut = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const { _id } = req.user;

    const user = await User.findByIdAndUpdate(
      _id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );

    if (!user) {
      throw new Error("User not found");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logout Successfully"));
  }
);

const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new Error("unauthorized request");
    }

    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_SECRET as string
    );

    const user = await User.findById(incomingRefreshToken._id);

    if (!user) {
      throw new Error("Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new Error("Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "User registered Successfully"
        )
      );
  }
);

const changePassword = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req?.user?._id);

    if (!user) {
      throw new Error("User not found");
    }

    const isCorrectPassword = await user?.isPasswordCorrect(oldPassword);

    if (!isCorrectPassword) {
      throw new Error("Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password change successfully"));
  }
);

export { register, login, logOut, refreshToken, changePassword };
