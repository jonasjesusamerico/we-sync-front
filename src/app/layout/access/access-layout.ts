import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Brand } from '../../shared/ui/brand/brand';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

/**
 * Frame of the login and register pages (DAS 2.4): blue panel (`[wsAccessPanel]`, from lg up) and the form.
 * Below lg only the brand shows above the form.
 */
@Component({
  selector: 'ws-access-layout',
  imports: [Brand, ThemeToggle],
  templateUrl: './access-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessLayout {}
