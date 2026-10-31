import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastHostComponent } from './shared/notifier/toast-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHostComponent],
  template: '<router-outlet /><app-toast-host />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
