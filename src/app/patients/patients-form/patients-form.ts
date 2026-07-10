import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService, Patient } from '../../services/patient';
import { PrescriptionService, DrugSuggestion } from '../../services/prescription';
import { Subject, debounceTime, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-patients-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './patients-form.html',
  styleUrl: './patients-form.css',
})
export class PatientsForm implements OnInit {
  isEditMode = signal(false);
  patientId = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  patient = signal<Partial<Patient>>({
    name: '',
    dateOfBirth: '',
    gender: 'male',
    bloodType: 'A+',
    allergies: [],
    chronicConditions: [],
    chronicMedications: [],
  });

  allergyInput = signal('');
  conditionInput = signal('');
  medicationInput = signal('');
  bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
// أخطاء التحقق الخاصة بكل حقل - بترجع فاضية لو الفورم سليم
  fieldErrors = signal<{ name?: string; nationalID?: string }>({});

  // بيتحقق من كل قواعد التحقق ويرجع true لو الفورم سليم، ويعبي fieldErrors لو لأ
validate(): boolean {
    const errors: { name?: string; nationalID?: string } = {};
    const { name, nationalID, dateOfBirth } = this.patient();

    // الاسم لازم يكون حروف عربية بس
    if (!name || !name.trim()) {
      errors.name = 'Full name is required';
    } else if (!/^[\u0621-\u064A\s]+$/.test(name)) {
      errors.name = 'Name must be written in Arabic letters only';
    }

    // الرقم القومي اختياري - بس لو اتكتب، لازم يكون صحيح
    if (nationalID && nationalID.trim()) {
      if (!/^\d{14}$/.test(nationalID)) {
        errors.nationalID = 'National ID must be exactly 14 digits';
      } else {
        const century = nationalID[0];
        const month = parseInt(nationalID.slice(3, 5), 10);
        const day = parseInt(nationalID.slice(5, 7), 10);
        const governorateCode = parseInt(nationalID.slice(7, 9), 10);

        if (century !== '2' && century !== '3') {
          errors.nationalID = 'Invalid National ID: first digit must be 2 or 3';
        } else if (month < 1 || month > 12) {
          errors.nationalID = 'Invalid National ID: birth month is invalid';
        } else if (day < 1 || day > 31) {
          errors.nationalID = 'Invalid National ID: birth day is invalid';
        } else if (!((governorateCode >= 1 && governorateCode <= 35) || governorateCode === 88)) {
          errors.nationalID = 'Invalid National ID: governorate code is invalid';
        } else if (dateOfBirth) {
          // نتأكد إن تاريخ الميلاد المكتوب يطابق التاريخ المشفّر جوه الرقم القومي
          const centuryBase = century === '2' ? 1900 : 2000;
          const yearFromId = centuryBase + parseInt(nationalID.slice(1, 3), 10);

          const [yearEntered, monthEntered, dayEntered] = dateOfBirth
            .split('-')
            .map((part) => parseInt(part, 10));

          if (
            yearEntered &&
            monthEntered &&
            dayEntered &&
            (yearFromId !== yearEntered || month !== monthEntered || day !== dayEntered)
          ) {
            errors.nationalID = `The birth date in the National ID (${month}/${day}/${yearFromId}) does not match the entered Date of Birth`;
          }
        }
      }
    }

    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  medicationSuggestions = signal<DrugSuggestion[]>([]);
  showMedicationSuggestions = signal(false);
  searchingMedications = signal(false);
  private medicationQuery$ = new Subject<string>();

  constructor(
    private patientService: PatientService,
    private prescriptionService: PrescriptionService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.medicationQuery$
      .pipe(
        debounceTime(350),
        switchMap((query) => {
          if (!query || query.trim().length < 2) {
            this.searchingMedications.set(false);
            return of([] as DrugSuggestion[]);
          }
          this.searchingMedications.set(true);
          return this.prescriptionService
            .searchDrugs(query.trim())
            .pipe(switchMap((res) => of(res.data || [])));
        }),
      )
      .subscribe((data) => {
        this.searchingMedications.set(false);
        this.medicationSuggestions.set(data);
      });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.patientId.set(id);
      this.isEditMode.set(true);
      this.loadPatient();
    }
  }

  loadPatient(): void {
    this.isLoading.set(true);
    this.patientService.getById(this.patientId()).subscribe({
      next: (res) => {
        const data = { ...res.data, dateOfBirth: res.data.dateOfBirth?.split('T')[0] };
        this.patient.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load patient');
        this.isLoading.set(false);
      },
    });
  }

  addAllergy(): void {
    const val = this.allergyInput().trim();
    if (val) {
      this.patient.update((p) => ({
        ...p,
        allergies: [...(p.allergies || []), val],
      }));
      this.allergyInput.set('');
    }
  }

  removeAllergy(index: number): void {
    this.patient.update((p) => ({
      ...p,
      allergies: p.allergies?.filter((_, i) => i !== index),
    }));
  }

  addCondition(): void {
    const val = this.conditionInput().trim();
    if (val) {
      this.patient.update((p) => ({
        ...p,
        chronicConditions: [...(p.chronicConditions || []), val],
      }));
      this.conditionInput.set('');
    }
  }

  removeCondition(index: number): void {
    this.patient.update((p) => ({
      ...p,
      chronicConditions: p.chronicConditions?.filter((_, i) => i !== index),
    }));
  }

  onMedicationInputChange(value: string): void {
    this.medicationInput.set(value);
    this.showMedicationSuggestions.set(true);
    this.medicationQuery$.next(value);
  }

  hideMedicationSuggestionsSoon(): void {
    setTimeout(() => this.showMedicationSuggestions.set(false), 200);
  }

  addMedication(name?: string): void {
    const val = (name ?? this.medicationInput()).trim();
    if (val) {
      this.patient.update((p) => {
        const existing = p.chronicMedications || [];
        if (existing.some((m) => m.toLowerCase() === val.toLowerCase())) return p;
        return { ...p, chronicMedications: [...existing, val] };
      });
    }
    this.medicationInput.set('');
    this.medicationSuggestions.set([]);
    this.showMedicationSuggestions.set(false);
  }

  selectMedicationSuggestion(drug: DrugSuggestion): void {
    this.addMedication(drug.displayName);
  }

  removeMedication(index: number): void {
    this.patient.update((p) => ({
      ...p,
      chronicMedications: p.chronicMedications?.filter((_, i) => i !== index),
    }));
  }

  updateField(field: keyof Patient, value: any): void {
    this.patient.update((p) => ({ ...p, [field]: value }));
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.validate()) {
      this.errorMessage.set('Please fix the highlighted fields before saving');
      return;
    }

    this.isLoading.set(true);

    if (this.isEditMode()) {
      this.patientService.update(this.patientId(), this.patient()).subscribe({
        next: () => this.router.navigate(['/dashboard/patients']),
        error: () => {
          this.errorMessage.set('Failed to update patient');
          this.isLoading.set(false);
        },
      });
    } else {
      this.patientService.create(this.patient()).subscribe({
        next: () => this.router.navigate(['/dashboard/patients']),
        error: () => {
          this.errorMessage.set('Failed to create patient');
          this.isLoading.set(false);
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/patients']);
  }
}
