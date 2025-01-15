// using Promise
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err)); //use reject or catch
  };
};

// using try-catch
// export const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(res, res, next);
//   } catch (error) {
//     res
//       .status(error.code || 500)
//       .json({ success: false, message: error.message });
//   }
// };
