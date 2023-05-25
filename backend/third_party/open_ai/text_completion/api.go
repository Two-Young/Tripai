package text_completion

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"travel-ai/log"
	"travel-ai/third_party/open_ai"
	"travel-ai/util"
)

const (
	MODEL_GPT_3_5_TURBO      = "gpt-3.5-turbo"
	MODEL_GPT_3_5_TURBO_0301 = "gpt-3.5-turbo-0301"
	MODEL_GPT_4              = "gpt-4"
	MODEL_GPT_4_0314         = "gpt-4-0314"
	MODEL_GPT_4_32k          = "gpt-4-32k"
	MODEL_GPT_4_32k_0314     = "gpt-4-32k-0314"

	REQUEST_URL = "https://api.openai.com/v1/chat/completions"

	ROLE_USER      = "user"
	ROLE_SYSTEM    = "system"
	ROLE_ASSISTANT = "assistant"
)

type CompletionRequest struct {
	Messages []CompletionMessage `json:"messages"`
	//MaxTokens        int                 `json:"max_tokens"`
	Temperature      float64  `json:"temperature"`
	TopP             float64  `json:"top_p"`
	FrequencyPenalty float64  `json:"frequency_penalty"`
	PresencePenalty  float64  `json:"presence_penalty"`
	Stop             []string `json:"stop"`
	Model            string   `json:"model"`
	Stream           bool     `json:"stream"`
}

type CompletionMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
	Name    string `json:"name"`
}

type CompletionSyncResponse struct {
	Choices []struct {
		Message      CompletionMessage `json:"message"`
		FinishReason string            `json:"finish_reason"`
		Index        int               `json:"index"`
	} `json:"choices"`
}

type CompletionErrorResponse struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
		Type    string `json:"type"`
		Param   string `json:"param"`
	}
}

type CompletionStreamResponse struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
		Index        int    `json:"index"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
}

func RequestCompletionSync(model string, role string, prompt string) (CompletionSyncResponse, error) {
	// make http request
	message := CompletionMessage{
		Role:    role,
		Content: prompt,
		Name:    "Traveler",
	}
	request := CompletionRequest{
		Messages:         []CompletionMessage{message},
		Temperature:      0.7,
		TopP:             1,
		FrequencyPenalty: 0,
		PresencePenalty:  0,
		Stop:             nil,
		Model:            model,
		Stream:           false,
	}
	requestBody := util.StructToReadable(request)

	req, err := http.NewRequest("POST", REQUEST_URL, requestBody)
	if err != nil {
		return CompletionSyncResponse{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+open_ai.GetOpenAiApiKey())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return CompletionSyncResponse{}, err
	}
	defer resp.Body.Close()

	bodyContent, err := io.ReadAll(resp.Body)

	// parse response
	if resp.StatusCode == http.StatusOK {
		var response CompletionSyncResponse
		if err = json.Unmarshal(bodyContent, &response); err != nil {
			return CompletionSyncResponse{}, err
		}
		return response, nil
	} else {
		var response CompletionErrorResponse
		if err = json.Unmarshal(bodyContent, &response); err != nil {
			return CompletionSyncResponse{}, err
		}
		return CompletionSyncResponse{}, fmt.Errorf("RequestError[%d] %s :: %s", resp.StatusCode, response.Error.Type, response.Error.Message)
	}
}

func RequestCompletion(model string, role string, prompt string) (*io.PipeReader, error) {
	// make http request
	message := CompletionMessage{
		Role:    role,
		Content: prompt,
		Name:    "Traveler",
	}
	request := CompletionRequest{
		Messages:         []CompletionMessage{message},
		Temperature:      0.7,
		TopP:             1,
		FrequencyPenalty: 0,
		PresencePenalty:  0,
		Stop:             nil,
		Model:            model,
		Stream:           true,
	}
	requestBody := util.StructToReadable(request)

	req, err := http.NewRequest("POST", REQUEST_URL, requestBody)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+open_ai.GetOpenAiApiKey())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}

	// parse response
	if resp.StatusCode == http.StatusOK {
		src, dst := io.Pipe()

		go func() {
			defer func() {
				resp.Body.Close()
				dst.Close()
			}()
			reader := bufio.NewReader(resp.Body)

			fmt.Printf("Response: ")
			for {
				lineBuffer, isPrefix, err := reader.ReadLine()
				if err != nil {
					if err == io.EOF {
						break
					}
					log.Errorf("Failed to read line: %s", err.Error())
					break
				}
				if !isPrefix && len(lineBuffer) > 0 {
					line := string(lineBuffer)
					data := strings.TrimPrefix(line, "data:")

					var chunk CompletionStreamResponse
					if err = json.Unmarshal([]byte(data), &chunk); err != nil {
						//log.Warnf("Failed to parse chunk: %s", err.Error())
						continue
					}
					content := chunk.Choices[0].Delta.Content

					if _, err = dst.Write([]byte(content)); err != nil {
						log.Errorf("Failed to write to pipe: %s", err.Error())
						continue
					}

					fmt.Printf("%s", content)
				}
			}
			fmt.Printf("\n")
		}()
		return src, nil
	} else {
		defer resp.Body.Close()
		bodyContent, err := io.ReadAll(resp.Body)
		var response CompletionErrorResponse
		if err = json.Unmarshal(bodyContent, &response); err != nil {
			return nil, err
		}
		return nil, fmt.Errorf("RequestError[%d] %s :: %s", resp.StatusCode, response.Error.Type, response.Error.Message)
	}
}
