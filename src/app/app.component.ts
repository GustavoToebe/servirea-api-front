import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme/theme.service';
import { DialogoHostComponent } from './shared/components/dialogo-host/dialogo-host.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, DialogoHostComponent],
    template: '<router-outlet /><app-dialogo-host />'
})
export class AppComponent {
  constructor() {
    inject(ThemeService);
  }
}
