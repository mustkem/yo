import { InitSchema1730001000000 } from './1730001000000-InitSchema';
import { UpdateUsernameField1763367521803 } from './1763367521803-UpdateUsernameField';

// Migration chain: baseline schema
export const migrations = [
  InitSchema1730001000000,
  UpdateUsernameField1763367521803,
];
