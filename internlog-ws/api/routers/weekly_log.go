package routers

import (
	"internlog-backend/api/handlers"

	"github.com/gofiber/fiber/v3"
)

func WeeklyLogRoutes(router fiber.Router, handler *handlers.WeeklyLogHandler) {
	router.Post("/weekly-log", handler.Save)
	router.Get("/weekly-log/:weekNumber", handler.GetByWeekNumber)
}
