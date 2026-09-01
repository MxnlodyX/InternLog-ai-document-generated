package handlers

import (
	"internlog-backend/pkg/readiness"

	"github.com/gofiber/fiber/v3"
)

type ReadinessHandler struct {
	service *readiness.Service
}

func NewReadinessHandler(service *readiness.Service) *ReadinessHandler {
	return &ReadinessHandler{service: service}
}
func (h *ReadinessHandler) Check(c fiber.Ctx) error {
	if err := h.service.Check(c.Context()); err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"status": "not_ready",
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status": "ready",
	})
}
