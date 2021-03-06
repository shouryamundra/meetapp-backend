import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';
import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().required(),
    });

    // if is not valid, go inside if-statement
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation has failed' });
    }

    // getting the user credentials to verify its authenticity below
    const { email, password } = req.body;

    // try to find user by email
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });
    if (!user) {
      return res.status(401).json({
        error: `User not found`,
      });
    }

    // comparing the password with its hash
    const isPasswordValid = await user.checkPassword(password); // either true or false
    if (!isPasswordValid) {
      return res.status(401).json({
        error: `Password does not match`,
      });
    }

    // it verification goes right, create session token and also destruct some user info
    const { id, name, avatar } = user;
    const token = jwt.sign({ id }, authConfig.secret, {
      expiresIn: authConfig.expiresIn,
    });

    return res.json({
      user: {
        id,
        name,
        email,
        avatar,
      },
      token,
    });
  }

  // df1ae6885734758712e86808dae636d8
}

export default new SessionController();
