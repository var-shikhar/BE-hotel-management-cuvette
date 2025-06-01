/*
|--------------------------------------------------------------------------- 
| Get Req User
|--------------------------------------------------------------------------- 
| Retrieves the authenticated user from the request, verifies the user exists, 
| and handles errors if the user is not found or the session is invalid.
*/


import { CustomError } from "../middleware/errorMiddleware.js";
import User from "../modal/user-modal.js";
import RouteCode from "./httpStatus.js";

const getReqUser = async (req, res, next) => {
    const { id } = req.user;
    if (!id) return next(new CustomError(RouteCode.LOGOUT_REQESTED.message, RouteCode.LOGOUT_REQESTED.statusCode));
    try {
        const foundUser = await User.findById({ _id: id });
        if (!foundUser) next(new CustomError(RouteCode.LOGOUT_REQESTED.message, RouteCode.LOGOUT_REQESTED.statusCode));
        return foundUser
    } catch (error) {
        next(error);
    }
}

export default getReqUser