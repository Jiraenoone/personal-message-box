import prisma from '../utils/prisma.js';
import { NotFoundError } from '../utils/errors.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

/**
 * Require that req.params.id is a message box owned by req.user. Attaches req.box.
 * Responds 404 (not 403) for other users' boxes so box IDs can't be probed.
 * Must run after authenticate.
 */
export async function requireBoxOwner(req, res, next) {
  try {
    const { id } = req.params;
    if (!isUuid(id)) throw new NotFoundError('Message box');

    const box = await prisma.messageBox.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!box) throw new NotFoundError('Message box');

    req.box = box;
    next();
  } catch (error) {
    next(error);
  }
}

export default { requireBoxOwner, isUuid };
