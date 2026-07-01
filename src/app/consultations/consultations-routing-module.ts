import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./consultation-list/consultation-list').then((m) => m.ConsultationListComponent),
  },
  {
    // بدل ما يروح لفورم الكونسلتيشن على طول، يختار مريض الأول
    path: 'add',
    loadComponent: () =>
      import('../patients/select-patient/select-patient').then((m) => m.SelectPatient),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./consultation-details/consultation-details').then((m) => m.ConsultationDetails),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsultationsRoutingModule {}
