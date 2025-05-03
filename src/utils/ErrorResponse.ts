class ErrorResponse {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;
  constructor(statusCode: number, data: any, message: string = "Success") {
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
  }
}

export { ErrorResponse };
