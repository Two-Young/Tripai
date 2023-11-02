package database

import (
	"context"
	"errors"
	"github.com/redis/go-redis/v9"
	"time"
)

var InMemoryDB InMemoryDatabase

var (
	ErrValueNotFound = errors.New("value not found")
)

type InMemoryDatabase interface {
	Set(key string, value string) error
	SetExp(key string, value string, expires time.Duration) error
	Get(key string) (string, error)
	Del(key string) error
	LPush(key string, value string) error
	LPushExp(key string, value string, expires time.Duration) error
	LRange(key string, start int64, stop int64) ([]string, error)
	RPush(key string, value string) error
	RPushExp(key string, value string, expires time.Duration) error
	LLen(key string) (int64, error)
	LRem(key string, count int64, value string) error
	Expire(key string, expiration time.Duration) error
}

type Redis struct {
	client *redis.Client
}

func NewRedis() *Redis {
	r := &Redis{}
	r.client = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})
	return r
}

func (r *Redis) Set(key string, value string) error {
	return r.client.Set(context.Background(), key, value, 0).Err()
}

func (r *Redis) SetExp(key string, value string, expires time.Duration) error {
	return r.client.Set(context.Background(), key, value, expires).Err()
}

func (r *Redis) Get(key string) (string, error) {
	str, err := r.client.Get(context.Background(), key).Result()
	if err == redis.Nil {
		return "", ErrValueNotFound
	}
	return str, err
}

func (r *Redis) Del(key string) error {
	return r.client.Del(context.Background(), key).Err()
}

func (r *Redis) LPush(key string, value string) error {
	return r.client.LPush(context.Background(), key, value).Err()
}

func (r *Redis) LPushExp(key string, value string, expires time.Duration) error {
	if err := r.client.LPush(context.Background(), key, value).Err(); err != nil {
		return err
	}
	return r.client.Expire(context.Background(), key, expires).Err()
}

func (r *Redis) LRange(key string, start int64, stop int64) ([]string, error) {
	return r.client.LRange(context.Background(), key, start, stop).Result()
}

func (r *Redis) RPush(key string, value string) error {
	return r.client.RPush(context.Background(), key, value).Err()
}

func (r *Redis) RPushExp(key string, value string, expires time.Duration) error {
	if err := r.client.RPush(context.Background(), key, value).Err(); err != nil {
		return err
	}
	return r.client.Expire(context.Background(), key, expires).Err()
}

func (r *Redis) LLen(key string) (int64, error) {
	return r.client.LLen(context.Background(), key).Result()
}

func (r *Redis) LRem(key string, count int64, value string) error {
	return r.client.LRem(context.Background(), key, count, value).Err()
}

func (r *Redis) Expire(key string, expiration time.Duration) error {
	return r.client.Expire(context.Background(), key, expiration).Err()
}
