import { Resend } from 'resend';
import { keys } from './keys';
import { createInviteEmail } from './templates/invite';

export const resend = new Resend(keys().RESEND_TOKEN);

export { createInviteEmail };
