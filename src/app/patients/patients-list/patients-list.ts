// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-patients-list',
//   imports: [],
//   templateUrl: './patients-list.html',
//   styleUrl: './patients-list.css',
// })
// export class PatientsList {}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PatientService, Patient } from "../../services/patient";

@Component({
  selector: 'app-patients-list',
  imports: [CommonModule],
  templateUrl: './patients-list.html',
  styleUrl: './patients-list.css',
})
export class PatientsList implements OnInit {
  patients: Patient[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private patientService: PatientService, private router: Router) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading = true;
    this.patientService.getAll().subscribe({
      next: (res) => {
        this.patients = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load patients';
        this.isLoading = false;
      },
    });
  }

  goToAdd(): void {
    this.router.navigate(['/dashboard/patients/add']);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/dashboard/patients/edit', id]);
  }

  deletePatient(id: string): void {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    this.patientService.delete(id).subscribe({
      next: () => {
        this.patients = this.patients.filter((p) => p._id !== id);
      },
      error: () => {
        this.errorMessage = 'Failed to delete patient';
      },
    });
  }

  calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
}