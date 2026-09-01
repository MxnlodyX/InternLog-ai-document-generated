package handlers

import (
	"internlog-backend/pkg/healthy"

	"github.com/gofiber/fiber/v3"
)

func HealthyCheck(c fiber.Ctx) error {
	if err := c.SendString(healthy.HealthCheck()); err != nil {
		return err
	}
	return nil
}
