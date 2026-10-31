import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { notify } from './notify';

describe('notify', () => {
  it('notify', () => {
    const snackBar = TestBed.inject(MatSnackBar);
    const open = vi.spyOn(snackBar, 'open').mockReturnValue(undefined as never);
    notify(snackBar, 'Lançamento salvo.');
    expect(open).toHaveBeenCalledWith('Lançamento salvo.', undefined, {
      duration: 5000,
      politeness: 'polite',
    });
  });
});
