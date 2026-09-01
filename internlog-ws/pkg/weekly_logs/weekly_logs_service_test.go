package weekly_logs

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"internlog-backend/pkg/entities"
)

// fakeRepository ปลอมตัวเป็น Repository
// ไม่มีการเชื่อมต่อฐานข้อมูลจริง
type fakeRepository struct {
	upsertCalled  bool
	savedWeekly   *entities.WeeklyLog
	upsertResult  *entities.WeeklyLog
	upsertErr     error
	getCalled     bool
	requestedWeek int
	getResult     *entities.WeeklyLog
	getErr        error
}

func (f *fakeRepository) Upsert(
	ctx context.Context,
	weekly *entities.WeeklyLog,
) (*entities.WeeklyLog, error) {
	f.upsertCalled = true
	f.savedWeekly = weekly

	if f.upsertErr != nil {
		return nil, f.upsertErr
	}
	if f.upsertResult != nil {
		return f.upsertResult, nil
	}

	return weekly, nil
}

func (f *fakeRepository) GetByWeekNumber(
	ctx context.Context,
	weekNumber int,
) (*entities.WeeklyLog, error) {
	f.getCalled = true
	f.requestedWeek = weekNumber

	return f.getResult, f.getErr
}

// สร้างข้อมูลที่ถูกต้องไว้ใช้ซ้ำในแต่ละ test
func validWeeklyLog() *entities.WeeklyLog {
	startDate := time.Date(2026, 8, 3, 0, 0, 0, 0, time.UTC)

	dailyLogs := make([]entities.DailyLog, 5)

	for index := range dailyLogs {
		dailyLogs[index] = entities.DailyLog{
			WorkDate: startDate.AddDate(0, 0, index),
			Hours:    8,
			Task:     "ทดสอบงาน",
		}
	}

	return &entities.WeeklyLog{
		WeekNumber: 1,
		StartDate:  startDate,
		EndDate:    startDate.AddDate(0, 0, 4),
		Summary:    "ทดสอบ weekly log",
		DailyLogs:  dailyLogs,
	}
}

func TestServiceSaveValidWeeklyLog(t *testing.T) {
	// Arrange: เตรียม Service และข้อมูล
	repository := &fakeRepository{}
	service := NewService(repository)
	weekly := validWeeklyLog()

	// Act: เรียก method ที่ต้องการทดสอบ
	result, err := service.Save(context.Background(), weekly)

	// Assert: ตรวจผลลัพธ์
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if !repository.upsertCalled {
		t.Fatal("expected repository Upsert to be called")
	}

	if result.Status != "draft" {
		t.Errorf("expected status draft, got %q", result.Status)
	}

	if repository.savedWeekly != weekly {
		t.Error("expected repository to receive the weekly log")
	}
}

func TestServiceSaveRejectsInvalidHours(t *testing.T) {
	// Arrange
	repository := &fakeRepository{}
	service := NewService(repository)
	weekly := validWeeklyLog()

	weekly.DailyLogs[0].Hours = 25

	// Act
	result, err := service.Save(context.Background(), weekly)

	// Assert
	if !errors.Is(err, ErrInvalidWeeklyLog) {
		t.Fatalf("expected ErrInvalidWeeklyLog, got %v", err)
	}

	if result != nil {
		t.Errorf("expected nil result, got %#v", result)
	}

	if repository.upsertCalled {
		t.Error("repository must not be called when validation fails")
	}
}

func TestServiceSaveValidation(t *testing.T) {
	tests := []struct {
		name   string
		weekly func() *entities.WeeklyLog
	}{
		{
			name: "nil weekly log",
			weekly: func() *entities.WeeklyLog {
				return nil
			},
		},
		{
			name: "week below range",
			weekly: func() *entities.WeeklyLog {
				weekly := validWeeklyLog()
				weekly.WeekNumber = 0
				return weekly
			},
		},
		{
			name: "week above range",
			weekly: func() *entities.WeeklyLog {
				weekly := validWeeklyLog()
				weekly.WeekNumber = 17
				return weekly
			},
		},
		{
			name: "start date after end date",
			weekly: func() *entities.WeeklyLog {
				weekly := validWeeklyLog()
				weekly.StartDate = weekly.EndDate.AddDate(0, 0, 1)
				return weekly
			},
		},
		{
			name: "date range is not five days",
			weekly: func() *entities.WeeklyLog {
				weekly := validWeeklyLog()
				weekly.EndDate = weekly.StartDate.AddDate(0, 0, 5)
				return weekly
			},
		},
		{
			name: "daily logs are fewer than five",
			weekly: func() *entities.WeeklyLog {
				weekly := validWeeklyLog()
				weekly.DailyLogs = weekly.DailyLogs[:4]
				return weekly
			},
		},
		{
			name: "hours below range",
			weekly: func() *entities.WeeklyLog {
				weekly := validWeeklyLog()
				weekly.DailyLogs[0].Hours = -1
				return weekly
			},
		},
		{
			name: "work date outside week",
			weekly: func() *entities.WeeklyLog {
				weekly := validWeeklyLog()
				weekly.DailyLogs[0].WorkDate = weekly.EndDate.AddDate(0, 0, 1)
				return weekly
			},
		},
		{
			name: "duplicate work date",
			weekly: func() *entities.WeeklyLog {
				weekly := validWeeklyLog()
				weekly.DailyLogs[1].WorkDate = weekly.DailyLogs[0].WorkDate
				return weekly
			},
		},
		{
			name: "invalid status",
			weekly: func() *entities.WeeklyLog {
				weekly := validWeeklyLog()
				weekly.Status = "approved"
				return weekly
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			repository := &fakeRepository{}
			service := NewService(repository)

			result, err := service.Save(context.Background(), test.weekly())

			if !errors.Is(err, ErrInvalidWeeklyLog) {
				t.Fatalf("expected ErrInvalidWeeklyLog, got %v", err)
			}
			if result != nil {
				t.Errorf("expected nil result, got %#v", result)
			}
			if repository.upsertCalled {
				t.Error("repository must not be called when validation fails")
			}
		})
	}
}

func TestServiceSavePropagatesRepositoryError(t *testing.T) {
	expectedErr := errors.New("database unavailable")
	repository := &fakeRepository{upsertErr: expectedErr}
	service := NewService(repository)

	result, err := service.Save(context.Background(), validWeeklyLog())

	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected repository error, got %v", err)
	}
	if result != nil {
		t.Errorf("expected nil result, got %#v", result)
	}
	if !repository.upsertCalled {
		t.Error("expected repository Upsert to be called")
	}
}

func TestServiceGetByWeekNumber(t *testing.T) {
	expectedWeekly := validWeeklyLog()
	repository := &fakeRepository{getResult: expectedWeekly}
	service := NewService(repository)

	result, err := service.GetByWeekNumber(context.Background(), 1)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if result != expectedWeekly {
		t.Error("expected service to return repository result")
	}
	if !repository.getCalled {
		t.Fatal("expected repository GetByWeekNumber to be called")
	}
	if repository.requestedWeek != 1 {
		t.Errorf("expected requested week 1, got %d", repository.requestedWeek)
	}
}

func TestServiceGetByWeekNumberRejectsInvalidWeek(t *testing.T) {
	for _, weekNumber := range []int{0, 17} {
		t.Run(fmt.Sprintf("week %d", weekNumber), func(t *testing.T) {
			repository := &fakeRepository{}
			service := NewService(repository)

			result, err := service.GetByWeekNumber(context.Background(), weekNumber)

			if !errors.Is(err, ErrInvalidWeeklyLog) {
				t.Fatalf("expected ErrInvalidWeeklyLog, got %v", err)
			}
			if result != nil {
				t.Errorf("expected nil result, got %#v", result)
			}
			if repository.getCalled {
				t.Error("repository must not be called when week is invalid")
			}
		})
	}
}

func TestServiceGetByWeekNumberPropagatesRepositoryError(t *testing.T) {
	expectedErr := ErrWeeklyLogNotFound
	repository := &fakeRepository{getErr: expectedErr}
	service := NewService(repository)

	result, err := service.GetByWeekNumber(context.Background(), 16)

	if !errors.Is(err, expectedErr) {
		t.Fatalf("expected repository error, got %v", err)
	}
	if result != nil {
		t.Errorf("expected nil result, got %#v", result)
	}
	if !repository.getCalled {
		t.Error("expected repository GetByWeekNumber to be called")
	}
}
