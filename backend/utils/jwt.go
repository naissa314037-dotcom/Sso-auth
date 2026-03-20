package utils

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"log"
	"math/big"
	"os"
	"path/filepath"
	"time"

	"sso-auth/config"
	"sso-auth/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	privateKey *rsa.PrivateKey
	publicKey  *rsa.PublicKey
	keyID      string
)

// InitKeys loads or generates RSA keys for JWT signing
func InitKeys() {
	keysDir := "keys"
	privPath := filepath.Join(keysDir, "private.pem")
	pubPath := filepath.Join(keysDir, "public.pem")

	// Check if keys exist
	if _, err := os.Stat(privPath); os.IsNotExist(err) {
		log.Println("Generating new RSA key pair...")
		os.MkdirAll(keysDir, 0700)

		// Generate 2048-bit RSA key
		key, err := rsa.GenerateKey(rand.Reader, 2048)
		if err != nil {
			log.Fatalf("Failed to generate RSA key: %v", err)
		}

		// Save private key
		privFile, err := os.Create(privPath)
		if err != nil {
			log.Fatalf("Failed to create private key file: %v", err)
		}
		defer privFile.Close()
		pem.Encode(privFile, &pem.Block{
			Type:  "RSA PRIVATE KEY",
			Bytes: x509.MarshalPKCS1PrivateKey(key),
		})
		os.Chmod(privPath, 0600)

		// Save public key
		pubBytes, err := x509.MarshalPKIXPublicKey(&key.PublicKey)
		if err != nil {
			log.Fatalf("Failed to marshal public key: %v", err)
		}
		pubFile, err := os.Create(pubPath)
		if err != nil {
			log.Fatalf("Failed to create public key file: %v", err)
		}
		defer pubFile.Close()
		pem.Encode(pubFile, &pem.Block{
			Type:  "PUBLIC KEY",
			Bytes: pubBytes,
		})

		log.Println("RSA key pair generated successfully")
	}

	// Load private key
	privData, err := os.ReadFile(privPath)
	if err != nil {
		log.Fatalf("Failed to read private key: %v", err)
	}
	privBlock, _ := pem.Decode(privData)
	privateKey, err = x509.ParsePKCS1PrivateKey(privBlock.Bytes)
	if err != nil {
		log.Fatalf("Failed to parse private key: %v", err)
	}
	publicKey = &privateKey.PublicKey

	// Generate a stable key ID from the public key modulus
	keyID = base64.RawURLEncoding.EncodeToString(publicKey.N.Bytes()[:8])

	log.Println("RSA keys loaded successfully")
}

// Claims represents the JWT claims
type Claims struct {
	UserID       uuid.UUID `json:"user_id"`
	Username     string    `json:"username"`
	IsSuperAdmin bool      `json:"is_super_admin"`
	Roles        []string  `json:"roles"`
	Permissions  []string  `json:"permissions"`
	jwt.RegisteredClaims
}

// GenerateToken creates a new JWT for the given user
func GenerateToken(user *models.User, cfg *config.Config) (string, error) {
	claims := Claims{
		UserID:       user.ID,
		Username:     user.Username,
		IsSuperAdmin: user.IsSuperAdmin,
		Roles:        user.GetRoleNames(),
		Permissions:  user.GetAllPermissions(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(cfg.JWTExpiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "sso-auth",
			Subject:   user.ID.String(),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = keyID

	return token.SignedString(privateKey)
}

// ParseToken validates and parses a JWT token
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return publicKey, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

// GetJWKS returns the JWKS (JSON Web Key Set) for the public key
func GetJWKS() map[string]interface{} {
	return map[string]interface{}{
		"keys": []map[string]interface{}{
			{
				"kty": "RSA",
				"use": "sig",
				"alg": "RS256",
				"kid": keyID,
				"n":   base64.RawURLEncoding.EncodeToString(publicKey.N.Bytes()),
				"e":   base64.RawURLEncoding.EncodeToString(big.NewInt(int64(publicKey.E)).Bytes()),
			},
		},
	}
}
