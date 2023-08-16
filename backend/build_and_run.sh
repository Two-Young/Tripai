pkill -9 -ef travel-ai
go build -o ./travel-ai ./core/main.go
nohup ./travel-ai > ./output.log &
tail -f ./output.log