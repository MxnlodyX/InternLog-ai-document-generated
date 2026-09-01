package dto

import (
	"time"

	"internlog-backend/pkg/entities"
)

type WeeklyReportRequest struct {
	TemplateID string            `json:"template_id"`
	Week       int               `json:"week"`
	StartDate  string            `json:"start_date"`
	EndDate    string            `json:"end_date"`
	ReportDate *string           `json:"report_date"`
	Summary    string            `json:"summary"`
	Days       []DailyLogRequest `json:"days"`
}

type DailyLogRequest struct {
	Date     string `json:"date"`
	Hours    int    `json:"hours"`
	Task     string `json:"task"`
	Lesson   string `json:"lesson"`
	Problem  string `json:"problem"`
	Solution string `json:"solution"`
}

type WeeklyReportResponse struct {
	ID         string             `json:"id"`
	Week       int                `json:"week"`
	StartDate  string             `json:"start_date"`
	EndDate    string             `json:"end_date"`
	ReportDate *string            `json:"report_date"`
	Summary    string             `json:"summary"`
	Status     string             `json:"status"`
	UpdatedAt  string             `json:"updated_at"`
	Days       []DailyLogResponse `json:"days"`
}

type DailyLogResponse struct {
	ID       string `json:"id"`
	Date     string `json:"date"`
	Hours    int    `json:"hours"`
	Task     string `json:"task"`
	Lesson   string `json:"lesson"`
	Problem  string `json:"problem"`
	Solution string `json:"solution"`
}

func ToWeeklyReportResponse(weekly *entities.WeeklyLog) WeeklyReportResponse {
	var reportDate *string

	if weekly.ReportDate != nil {
		formattedDate := weekly.ReportDate.Format(time.DateOnly)
		reportDate = &formattedDate
	}

	days := make([]DailyLogResponse, 0, len(weekly.DailyLogs))

	for _, daily := range weekly.DailyLogs {
		days = append(days, DailyLogResponse{
			ID:       daily.ID.String(),
			Date:     daily.WorkDate.Format(time.DateOnly),
			Hours:    daily.Hours,
			Task:     daily.Task,
			Lesson:   daily.Lesson,
			Problem:  daily.Problem,
			Solution: daily.Solution,
		})
	}

	return WeeklyReportResponse{
		ID:         weekly.ID.String(),
		Week:       weekly.WeekNumber,
		StartDate:  weekly.StartDate.Format(time.DateOnly),
		EndDate:    weekly.EndDate.Format(time.DateOnly),
		ReportDate: reportDate,
		Summary:    weekly.Summary,
		Status:     weekly.Status,
		UpdatedAt:  weekly.UpdatedAt.Format(time.RFC3339),
		Days:       days,
	}
}
