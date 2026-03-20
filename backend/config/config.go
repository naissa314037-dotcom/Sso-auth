package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	FrontendURL string

	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	SuperAdminUsername string
	SuperAdminPassword string
	SuperAdminName     string
	SuperAdminPhone    string

	JWTExpiryHours int
}

func Load() *Config {
	godotenv.Load()

	jwtExpiry, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))

	return &Config{
		Port:        getEnv("PORT", "8080"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),

		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "sso_auth"),

		SuperAdminUsername: getEnv("SUPER_ADMIN_USERNAME", "superadmin"),
		SuperAdminPassword: getEnv("SUPER_ADMIN_PASSWORD", "SuperAdmin@123"),
		SuperAdminName:     getEnv("SUPER_ADMIN_NAME", "Super Admin"),
		SuperAdminPhone:    getEnv("SUPER_ADMIN_PHONE", "0550000000"),

		JWTExpiryHours: jwtExpiry,
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
