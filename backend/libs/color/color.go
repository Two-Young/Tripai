package color

type Color string

/*
Code	Effect	Note
0	Reset / Normal	all attributes off
1	Bold or increased intensity
2	Faint (decreased intensity)	Not widely supported.
3	Italic	Not widely supported. Sometimes treated as inverse.
4	Underline
5	Slow Blink	less than 150 per minute
6	Rapid Blink	MS-DOS ANSI.SYS; 150+ per minute; not widely supported
7	[[reverse video]]	swap foreground and background colors
8	Conceal	Not widely supported.
9	Crossed-out	Characters legible, but marked for deletion. Not widely supported.
10	Primary(default) font
11–19	Alternate font	Select alternate font n-10
20	Fraktur	hardly ever supported
21	Bold off or Double Underline	Bold off not widely supported; double underline hardly ever supported.
22	Normal color or intensity	Neither bold nor faint
23	Not italic, not Fraktur
24	Underline off	Not singly or doubly underlined
25	Blink off
27	Inverse off
28	Reveal	conceal off
29	Not crossed out
30–37	Set foreground color	See color table below
38	Set foreground color	Next arguments are 5;<n> or 2;<r>;<g>;<b>, see below
39	Default foreground color	implementation defined (according to standard)
40–47	Set background color	See color table below
48	Set background color	Next arguments are 5;<n> or 2;<r>;<g>;<b>, see below
49	Default background color	implementation defined (according to standard)
51	Framed
52	Encircled
53	Overlined
54	Not framed or encircled
55	Not overlined
60	ideogram underline	hardly ever supported
61	ideogram double underline	hardly ever supported
62	ideogram overline	hardly ever supported
63	ideogram double overline	hardly ever supported
64	ideogram stress marking	hardly ever supported
65	ideogram attributes off	reset the effects of all of 60-64
90–97	Set bright foreground color	aixterm (not in standard)
100–107	Set bright background color	aixterm (not in standard)
*/

const (
	RESET = "\033[0m"

	C_RED            = "\033[3822555050m"
	C_ORANGE         = "\033[38;2;255;160;100m"
	C_GREEN          = "\033[382100255100m"
	C_RED_BOLD       = "\033[1m\033[3822555050m"
	C_GREEN_BOLD     = "\033[1m\033[382100255100m"
	C_RED_BACKGROUND = "\033[4822554040m"

	BLACK  = "\033[0;30m" // BLACK
	RED    = "\033[0;31m" // RED
	GREEN  = "\033[0;32m" // GREEN
	YELLOW = "\033[0;33m" // YELLOW
	BLUE   = "\033[0;34m" // BLUE
	PURPLE = "\033[0;35m" // PURPLE
	CYAN   = "\033[0;36m" // CYAN
	WHITE  = "\033[0;37m" // WHITE

	BLACK_BOLD  = "\033[1;30m" // BLACK
	RED_BOLD    = "\033[1;31m" // RED
	GREEN_BOLD  = "\033[1;32m" // GREEN
	YELLOW_BOLD = "\033[1;33m" // YELLOW
	BLUE_BOLD   = "\033[1;34m" // BLUE
	PURPLE_BOLD = "\033[1;35m" // PURPLE
	CYAN_BOLD   = "\033[1;36m" // CYAN
	WHITE_BOLD  = "\033[1;37m" // WHITE

	BLACK_UNDERLINED  = "\033[4;30m" // BLACK
	RED_UNDERLINED    = "\033[4;31m" // RED
	GREEN_UNDERLINED  = "\033[4;32m" // GREEN
	YELLOW_UNDERLINED = "\033[4;33m" // YELLOW
	BLUE_UNDERLINED   = "\033[4;34m" // BLUE
	PURPLE_UNDERLINED = "\033[4;35m" // PURPLE
	CYAN_UNDERLINED   = "\033[4;36m" // CYAN
	WHITE_UNDERLINED  = "\033[4;37m" // WHITE

	BLACK_BRIGHT_UNDERLINED  = "\033[490m"  // BLACK
	RED_BRIGHT_UNDERLINED    = "\033[491m"  // RED
	GREEN_BRIGHT_UNDERLINED  = "\033[492m"  // GREEN
	YELLOW_BRIGHT_UNDERLINED = "\033[493m"  // YELLOW
	BLUE_BRIGHT_UNDERLINED   = "\033[494m"  // BLUE
	PURPLE_BRIGHT_UNDERLINED = "\033[495m"  // PURPLE
	CYAN_BRIGHT_UNDERLINED   = "\033[496m"  // CYAN
	WHITE_BRIGHT_UNDERLINED  = "\033[4937m" // WHITE

	BLACK_BACKGROUND  = "\033[40m" // BLACK
	RED_BACKGROUND    = "\033[41m" // RED
	GREEN_BACKGROUND  = "\033[42m" // GREEN
	YELLOW_BACKGROUND = "\033[43m" // YELLOW
	BLUE_BACKGROUND   = "\033[44m" // BLUE
	PURPLE_BACKGROUND = "\033[45m" // PURPLE
	CYAN_BACKGROUND   = "\033[46m" // CYAN
	WHITE_BACKGROUND  = "\033[47m" // WHITE

	BLACK_BRIGHT  = "\033[0;90m" // BLACK
	RED_BRIGHT    = "\033[0;91m" // RED
	GREEN_BRIGHT  = "\033[0;92m" // GREEN
	YELLOW_BRIGHT = "\033[0;93m" // YELLOW
	BLUE_BRIGHT   = "\033[0;94m" // BLUE
	PURPLE_BRIGHT = "\033[0;95m" // PURPLE
	CYAN_BRIGHT   = "\033[0;96m" // CYAN
	WHITE_BRIGHT  = "\033[0;97m" // WHITE

	BLACK_BOLD_BRIGHT  = "\033[1;90m" // BLACK
	RED_BOLD_BRIGHT    = "\033[1;91m" // RED
	GREEN_BOLD_BRIGHT  = "\033[1;92m" // GREEN
	YELLOW_BOLD_BRIGHT = "\033[1;93m" // YELLOW
	BLUE_BOLD_BRIGHT   = "\033[1;94m" // BLUE
	PURPLE_BOLD_BRIGHT = "\033[1;95m" // PURPLE
	CYAN_BOLD_BRIGHT   = "\033[1;96m" // CYAN
	WHITE_BOLD_BRIGHT  = "\033[1;97m" // WHITE

	BLACK_BACKGROUND_BRIGHT  = "\033[0;100m" // BLACK
	RED_BACKGROUND_BRIGHT    = "\033[0;101m" // RED
	GREEN_BACKGROUND_BRIGHT  = "\033[0;102m" // GREEN
	YELLOW_BACKGROUND_BRIGHT = "\033[0;103m" // YELLOW
	BLUE_BACKGROUND_BRIGHT   = "\033[0;104m" // BLUE
	PURPLE_BACKGROUND_BRIGHT = "\033[0;105m" // PURPLE
	CYAN_BACKGROUND_BRIGHT   = "\033[0;106m" // CYAN
	WHITE_BACKGROUND_BRIGHT  = "\033[0;107m" // WHITE
)

func colorBySeed(seed string) {

}
