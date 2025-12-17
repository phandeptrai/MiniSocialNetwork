import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentList } from './component-list';

describe('ComponentList', () => {
  let component: ComponentList;
  let fixture: ComponentFixture<ComponentList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComponentList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
