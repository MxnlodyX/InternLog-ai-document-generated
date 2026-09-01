package weekly_logs

import (
	"context"
	"errors"
	"fmt"
	"internlog-backend/pkg/entities"
	"time"
)

var ErrInvalidWeeklyLog = errors.New(
	"invalid weekly log",
)

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) Save(ctx context.Context, weekly *entities.WeeklyLog) (*entities.WeeklyLog, error) {
	if weekly == nil {
		return nil, fmt.Errorf("%w: weekly log is required", ErrInvalidWeeklyLog)
	}
	if weekly.WeekNumber < 1 || weekly.WeekNumber > 16 {
		return nil, fmt.Errorf("%w: week number must be between 1 and 16", ErrInvalidWeeklyLog)
	}
	if weekly.StartDate.After(weekly.EndDate) {
		return nil, fmt.Errorf("%w: start date must be before end date", ErrInvalidWeeklyLog)
	}
	expectedEndDate := weekly.StartDate.AddDate(0, 0, 4)

	if !weekly.EndDate.Equal(expectedEndDate) {
		return nil, fmt.Errorf(
			"%w: weekly date range must contain exactly 5 days",
			ErrInvalidWeeklyLog,
		)
	}

	if len(weekly.DailyLogs) != 5 {
		return nil, fmt.Errorf(
			"%w: exactly 5 daily logs are required",
			ErrInvalidWeeklyLog,
		)
	}
	seenDates := make(map[string]struct{}, len(weekly.DailyLogs))

	for index, daily := range weekly.DailyLogs {
		if daily.Hours < 0 || daily.Hours > 24 {
			return nil, fmt.Errorf("%w: daily log at index %d: hours must be between 0 and 24", ErrInvalidWeeklyLog, index)
		}
		if daily.WorkDate.Before(weekly.StartDate) || daily.WorkDate.After(weekly.EndDate) {
			return nil, fmt.Errorf("%w: daily log at index %d: work date is outside the week range", ErrInvalidWeeklyLog, index)
		}

		dateKey := daily.WorkDate.Format(time.DateOnly)

		if _, exists := seenDates[dateKey]; exists {
			return nil, fmt.Errorf("%w: daily log at index %d: duplicate work date found", ErrInvalidWeeklyLog, index)
		}
		seenDates[dateKey] = struct{}{}
	}

	if weekly.Status == "" {
		weekly.Status = "draft"
	} else if weekly.Status != "draft" && weekly.Status != "submitted" {
		return nil, fmt.Errorf("%w: status must be either 'draft' or 'submitted'", ErrInvalidWeeklyLog)
	}

	return s.repository.Upsert(ctx, weekly)
}

func (s *Service) GetByWeekNumber(ctx context.Context, weekNumber int) (*entities.WeeklyLog, error) {
	if weekNumber < 1 || weekNumber > 16 {
		return nil, fmt.Errorf("%w: week number must be between 1 and 16", ErrInvalidWeeklyLog)
	}
	return s.repository.GetByWeekNumber(ctx, weekNumber)
}
