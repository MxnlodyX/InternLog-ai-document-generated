package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"internlog-backend/api/handlers"
	"internlog-backend/api/routers"
	"internlog-backend/config"
	"internlog-backend/pkg/readiness"
	"internlog-backend/pkg/weekly_logs"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load("../.env")

	db := databaseConnection()
	defer db.Close()

	readinessService := readiness.NewService(db)
	readinessHandler := handlers.NewReadinessHandler(readinessService)

	weeklyLogRepository := weekly_logs.NewRepository(db)
	weeklyLogService := weekly_logs.NewService(weeklyLogRepository)
	weeklyLogHandler := handlers.NewWeeklyLogHandler(weeklyLogService)

	port := os.Getenv("PORT")

	app := fiber.New()
	app.Use(cors.New())

	api := app.Group("/api")
	routers.WeeklyLogRoutes(api, weeklyLogHandler)

	app.Get("/healthz", handlers.HealthyCheck)
	app.Get("/readyz", readinessHandler.Check)

	log.Fatal(app.Listen(":" + port))
}

func databaseConnection() *pgxpool.Pool {
	ctx := context.Background()

	db, err := config.ConnectionDatabase(ctx)
	if err != nil {
		panic(fmt.Errorf("failed to connect to database: %w", err))
	}

	return db
}
