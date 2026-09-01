package entities

import (
	"time"

	"github.com/google/uuid"
)

type WeeklyLog struct {
	ID         uuid.UUID
	WeekNumber int
	StartDate  time.Time
	EndDate    time.Time
	ReportDate *time.Time
	Summary    string
	Status     string
	CreatedAt  time.Time
	UpdatedAt  time.Time
	DailyLogs  []DailyLog
}

type DailyLog struct {
	ID             uuid.UUID
	WeeklyReportID uuid.UUID
	WorkDate       time.Time
	Hours          int
	Task           string
	Lesson         string
	Problem        string
	Solution       string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}