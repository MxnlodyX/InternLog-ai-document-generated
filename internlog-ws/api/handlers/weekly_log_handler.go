package handlers

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"internlog-backend/dto"
	"internlog-backend/pkg/entities"
	"internlog-backend/pkg/weekly_logs"

	"github.com/gofiber/fiber/v3"
)

type WeeklyLogHandler struct {
	service *weekly_logs.Service
}

func NewWeeklyLogHandler(service *weekly_logs.Service) *WeeklyLogHandler {
	return &WeeklyLogHandler{service: service}
}

func (h *WeeklyLogHandler) Save(c fiber.Ctx) error {
	var request dto.WeeklyReportRequest

	if err := c.Bind().Body(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid request body",
		})
	}
	if request.TemplateID != "weekly-report" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "template_id must be 'weekly-report'",
		})
	}
	startDate, err := time.Parse("2006-01-02", request.StartDate)

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "start_date must be YYYY-MM-DD",
		})
	}

	endDate, err := time.Parse("2006-01-02", request.EndDate)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "end_date must be YYYY-MM-DD",
		})
	}
	var reportDate *time.Time

	if request.ReportDate != nil {
		parseReportDate, err := time.Parse("2006-01-02", *request.ReportDate)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"message": "report_date must be YYYY-MM-DD or null",
			})
		}
		reportDate = &parseReportDate
	}
	weekly := &entities.WeeklyLog{
		WeekNumber: request.Week,
		StartDate:  startDate,
		EndDate:    endDate,
		ReportDate: reportDate,
		Summary:    request.Summary,
	}
	for index, requestDay := range request.Days {
		workDate, err := time.Parse("2006-01-02", requestDay.Date)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"message": fmt.Sprintf("days[%d].date must be YYYY-MM-DD", index),
			})
		}
		weekly.DailyLogs = append(
			weekly.DailyLogs,
			entities.DailyLog{
				WorkDate: workDate,
				Hours:    requestDay.Hours,
				Task:     requestDay.Task,
				Lesson:   requestDay.Lesson,
				Problem:  requestDay.Problem,
				Solution: requestDay.Solution,
			},
		)
	}
	savedWeekly, err := h.service.Save(c.Context(), weekly)

	if errors.Is(err, weekly_logs.ErrInvalidWeeklyLog) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to save weekly report",
		})
	}

	return c.Status(fiber.StatusOK).JSON(dto.ToWeeklyReportResponse(savedWeekly))
}

func (h *WeeklyLogHandler) GetByWeekNumber(c fiber.Ctx) error {
	weekNumber, err := strconv.Atoi(c.Params("weekNumber"))

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "weekNumber must be a number",
		})
	}

	if weekNumber < 1 || weekNumber > 16 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "weekNumber must be between 1 and 16",
		})
	}

	weekly, err := h.service.GetByWeekNumber(c.Context(), weekNumber)

	if errors.Is(err, weekly_logs.ErrWeeklyLogNotFound) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "weekly report not found",
		})
	}

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to get weekly report",
		})
	}

	return c.Status(fiber.StatusOK).JSON(dto.ToWeeklyReportResponse(weekly))
}
