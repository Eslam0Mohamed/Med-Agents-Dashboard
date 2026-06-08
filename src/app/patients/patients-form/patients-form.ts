import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService, Patient } from '../../services/patient';

@Component({
  selector: 'app-patients-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './patients-form.html',
  styleUrl: './patients-form.css',
})
export class PatientsForm implements OnInit {
  isEditMode = false;
  patientId = '';
  isLoading = false;
  errorMessage = '';

  patient: Partial<Patient> = {
    name: '',
    dateOfBirth: '',
    gender: 'male',
    bloodType: 'A+',
    allergies: [],
    chronicConditions: [],
  };

  allergyInput = '';
  conditionInput = '';

  bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  constructor(
    private patientService: PatientService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.params['id'];
    if (this.patientId) {
      this.isEditMode = true;
      this.loadPatient();
    }
  }

  loadPatient(): void {
    this.isLoading = true;
    this.patientService.getById(this.patientId).subscribe({
      next: (res) => {
        this.patient = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load patient';
        this.isLoading = false;
      },
    });
  }

  addAllergy(): void {
    const val = this.allergyInput.trim();
    if (val) {
      this.patient.allergies = [...(this.patient.allergies || []), val];
      this.allergyInput = '';
    }
  }

  removeAllergy(index: number): void {
    this.patient.allergies = this.patient.allergies?.filter((_, i) => i !== index);
  }

  addCondition(): void {
    const val = this.conditionInput.trim();
    if (val) {
      this.patient.chronicConditions = [...(this.patient.chronicConditions || []), val];
      this.conditionInput = '';
    }
  }

  removeCondition(index: number): void {
    this.patient.chronicConditions = this.patient.chronicConditions?.filter((_, i) => i !== index);
  }

  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (this.isEditMode) {
      this.patientService.update(this.patientId, this.patient).subscribe({
        next: () => this.router.navigate(['/dashboard/patients']),
        error: () => {
          this.errorMessage = 'Failed to update patient';
          this.isLoading = false;
        },
      });
    } else {
      this.patientService.create(this.patient).subscribe({
        next: () => this.router.navigate(['/dashboard/patients']),
        error: () => {
          this.errorMessage = 'Failed to create patient';
          this.isLoading = false;
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/patients']);
  }
}
