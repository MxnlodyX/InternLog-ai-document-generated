package weekly_logs

import (
	"context"
	"errors"
	"fmt"
	"internlog-backend/pkg/entities"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrWeeklyLogNotFound = errors.New(
	"weekly log not found",
)

type Repository interface {
	Upsert(ctx context.Context, weekly *entities.WeeklyLog) (*entities.WeeklyLog, error)
	GetByWeekNumber(ctx context.Context, weekNumber int) (*entities.WeeklyLog, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) Upsert(ctx context.Context, weekly *entities.WeeklyLog) (*entities.WeeklyLog, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)
	const weeklyQuery = `
		INSERT INTO weekly_reports (week_number, start_date, end_date, report_date, summary, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (week_number) DO UPDATE SET
			start_date = EXCLUDED.start_date,
			end_date = EXCLUDED.end_date,
			report_date = EXCLUDED.report_date,
			summary = EXCLUDED.summary,
			status = EXCLUDED.status,
			updated_at = NOW()
		RETURNING id, created_at, updated_at
	`
	err = tx.QueryRow(
		ctx,
		weeklyQuery,
		weekly.WeekNumber,
		weekly.StartDate,
		weekly.EndDate,
		weekly.ReportDate,
		weekly.Summary,
		weekly.Status,
	).Scan(
		&weekly.ID,
		&weekly.CreatedAt,
		&weekly.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert weekly log: %w", err)
	}
	workDates := make([]time.Time, 0, len(weekly.DailyLogs))
	for _, daily := range weekly.DailyLogs {
		workDates = append(workDates, daily.WorkDate)
	}
	const deleteStaleDailyLogsQuery = `
			DELETE FROM daily_logs
			WHERE weekly_report_id = $1
				AND NOT (work_date = ANY($2::date[]))
			`
	if _, err := tx.Exec(ctx, deleteStaleDailyLogsQuery, weekly.ID, workDates); err != nil {
		return nil, fmt.Errorf("failed to delete stale daily logs: %w", err)
	}
	const dailyQuery = `
		INSERT INTO daily_logs (weekly_report_id, work_date, hours, task, lesson, problem, solution)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (weekly_report_id, work_date) DO UPDATE SET
			hours = EXCLUDED.hours,
			task = EXCLUDED.task,
			lesson = EXCLUDED.lesson,
			problem = EXCLUDED.problem,
			solution = EXCLUDED.solution,
			updated_at = NOW()
		RETURNING id, created_at, updated_at	
	`
	for index := range weekly.DailyLogs {
		daily := &weekly.DailyLogs[index]
		daily.WeeklyReportID = weekly.ID

		err = tx.QueryRow(
			ctx,
			dailyQuery,
			daily.WeeklyReportID,
			daily.WorkDate,
			daily.Hours,
			daily.Task,
			daily.Lesson,
			daily.Problem,
			daily.Solution,
		).Scan(
			&daily.ID,
			&daily.CreatedAt,
			&daily.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("upsert daily log %w", err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return weekly, nil
}
func (r *repository) GetByWeekNumber(ctx context.Context, weekNumber int) (*entities.WeeklyLog, error) {
	const weeklyQuery = `
		SELECT id, week_number, start_date, end_date, report_date, summary, status, created_at, updated_at
		FROM weekly_reports
		WHERE week_number = $1
		`
	weekly := &entities.WeeklyLog{}
	err := r.db.QueryRow(ctx, weeklyQuery, weekNumber).Scan(
		&weekly.ID,
		&weekly.WeekNumber,
		&weekly.StartDate,
		&weekly.EndDate,
		&weekly.ReportDate,
		&weekly.Summary,
		&weekly.Status,
		&weekly.CreatedAt,
		&weekly.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrWeeklyLogNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get weekly log: %w", err)
	}
	const dailyQuery = `
		SELECT id, weekly_report_id, work_date, hours, task, lesson, problem, solution, created_at, updated_at
		FROM daily_logs
		WHERE weekly_report_id = $1
		ORDER BY work_date
		`
	rows, err := r.db.Query(ctx, dailyQuery, weekly.ID)
	if err != nil {
		return nil, fmt.Errorf("get daily logs: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var daily entities.DailyLog
		if err := rows.Scan(
			&daily.ID,
			&daily.WeeklyReportID,
			&daily.WorkDate,
			&daily.Hours,
			&daily.Task,
			&daily.Lesson,
			&daily.Problem,
			&daily.Solution,
			&daily.CreatedAt,
			&daily.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan daily log: %w", err)
		}
		weekly.DailyLogs = append(weekly.DailyLogs, daily)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("Iterate daily log: %w", err)
	}
	return weekly, nil
}
